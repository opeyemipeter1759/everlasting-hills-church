import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InventoryCondition,
  InventoryHistoryType,
  InventoryStatus,
  Prisma,
  RepairStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { LogRepairDto } from './dto/log-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';

export interface ListInventoryQuery {
  category?: string;
  status?: InventoryStatus;
  condition?: InventoryCondition;
  location?: string;
  search?: string;
}

@Injectable()
export class InventoryService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(opts: ListInventoryQuery) {
    const where: Prisma.InventoryItemWhereInput = { tenantId: this.tenantId };
    if (opts.category) where.category = opts.category;
    if (opts.status) where.status = opts.status;
    if (opts.condition) where.condition = opts.condition;
    if (opts.location) where.location = { contains: opts.location, mode: 'insensitive' };
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { serialNumber: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.inventoryItem.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  /** Distinct categories/locations already in use — powers the filter dropdowns. */
  async filters() {
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId: this.tenantId },
      select: { category: true, location: true },
    });
    const categories = [...new Set(items.map((i) => i.category))].sort();
    const locations = [...new Set(items.map((i) => i.location).filter((l): l is string => !!l))].sort();
    return { categories, locations };
  }

  async stats() {
    const [total, underRepair, retired, valueAgg] = await Promise.all([
      this.prisma.inventoryItem.count({ where: { tenantId: this.tenantId } }),
      this.prisma.inventoryItem.count({
        where: { tenantId: this.tenantId, status: InventoryStatus.UNDER_REPAIR },
      }),
      this.prisma.inventoryItem.count({ where: { tenantId: this.tenantId, status: InventoryStatus.RETIRED } }),
      this.prisma.inventoryItem.aggregate({
        where: { tenantId: this.tenantId },
        _sum: { purchaseValue: true },
      }),
    ]);
    return { total, underRepair, retired, totalValue: valueAgg._sum.purchaseValue ?? 0 };
  }

  private async findOwnedOrThrow(id: string) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  /** Item + its full chronological history (New + every repair) + running spend total. */
  async getById(id: string) {
    const item = await this.findOwnedOrThrow(id);
    const history = await this.prisma.inventoryHistory.findMany({
      where: { tenantId: this.tenantId, itemId: id },
      orderBy: { occurredAt: 'asc' },
    });
    const totalSpent = history.reduce((sum, h) => sum + (h.cost ?? 0), 0);
    return { ...item, history, totalSpent };
  }

  /** Creates the item and its opening "New" history entry in one step. */
  async create(dto: CreateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: dto.name,
        category: dto.category,
        serialNumber: dto.serialNumber,
        location: dto.location,
        status: dto.status ?? InventoryStatus.IN_USE,
        condition: dto.condition ?? InventoryCondition.NEW,
        quantity: dto.quantity ?? 1,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchaseValue: dto.purchaseValue,
        assignedTo: dto.assignedTo,
        photoUrl: dto.photoUrl,
        notes: dto.notes,
      },
    });

    await this.prisma.inventoryHistory.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        itemId: item.id,
        type: InventoryHistoryType.NEW,
        description: 'Added to inventory',
        cost: dto.purchaseValue,
        performedBy: dto.vendor,
        occurredAt: dto.purchaseDate ? new Date(dto.purchaseDate) : new Date(),
      },
    });

    return item;
  }

  async update(id: string, dto: UpdateInventoryItemDto) {
    await this.findOwnedOrThrow(id);
    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.condition !== undefined && { condition: dto.condition }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.purchaseDate !== undefined && { purchaseDate: new Date(dto.purchaseDate) }),
        ...(dto.purchaseValue !== undefined && { purchaseValue: dto.purchaseValue }),
        ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: string) {
    await this.findOwnedOrThrow(id);
    await this.prisma.inventoryItem.delete({ where: { id } });
    return { id, deleted: true };
  }

  /** Logs a repair entry and syncs the item's status/condition to match. */
  async logRepair(itemId: string, dto: LogRepairDto) {
    await this.findOwnedOrThrow(itemId);

    const entry = await this.prisma.inventoryHistory.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        itemId,
        type: InventoryHistoryType.REPAIR,
        description: dto.description,
        resolution: dto.resolution,
        cost: dto.cost,
        performedBy: dto.performedBy,
        repairStatus: dto.status,
      },
    });

    await this.syncItemFromRepairStatus(itemId, dto.status);
    return entry;
  }

  /** Edits a repair entry already logged — e.g. moving it from pending to completed later. */
  async updateRepair(itemId: string, historyId: string, dto: UpdateRepairDto) {
    await this.findOwnedOrThrow(itemId);
    const existing = await this.prisma.inventoryHistory.findFirst({
      where: { id: historyId, itemId, tenantId: this.tenantId, type: InventoryHistoryType.REPAIR },
    });
    if (!existing) throw new NotFoundException('Repair entry not found');

    const entry = await this.prisma.inventoryHistory.update({
      where: { id: historyId },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.resolution !== undefined && { resolution: dto.resolution }),
        ...(dto.cost !== undefined && { cost: dto.cost }),
        ...(dto.performedBy !== undefined && { performedBy: dto.performedBy }),
        ...(dto.status !== undefined && { repairStatus: dto.status }),
      },
    });

    if (dto.status) {
      await this.syncItemFromRepairStatus(itemId, dto.status);
    }
    return entry;
  }

  /** Repair in flight → item goes UNDER_REPAIR. Repair completed → back IN_USE with a condition bump. */
  private async syncItemFromRepairStatus(itemId: string, repairStatus: RepairStatus) {
    if (repairStatus === RepairStatus.COMPLETED) {
      const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId } });
      await this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: { status: InventoryStatus.IN_USE, condition: this.bumpCondition(item?.condition) },
      });
    } else {
      await this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: { status: InventoryStatus.UNDER_REPAIR },
      });
    }
  }

  /** A completed repair nudges condition up one notch (Poor → Fair → Good); Good/New hold. */
  private bumpCondition(current?: InventoryCondition): InventoryCondition {
    if (current === InventoryCondition.POOR) return InventoryCondition.FAIR;
    if (current === InventoryCondition.FAIR) return InventoryCondition.GOOD;
    return current ?? InventoryCondition.GOOD;
  }
}
