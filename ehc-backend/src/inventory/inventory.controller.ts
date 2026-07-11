import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryCondition, InventoryStatus, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { LogRepairDto } from './dto/log-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';

/**
 * Church inventory — physical assets and their full lifecycle (purchase + repairs).
 * ADMIN+ only (RolesGuard hierarchy admits PASTOR / SUPER_ADMIN too).
 */
@ApiTags('inventory')
@Controller('inventory')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory items, with optional filters/search (ADMIN+)' })
  list(
    @Query('category') category?: string,
    @Query('status') status?: InventoryStatus,
    @Query('condition') condition?: InventoryCondition,
    @Query('location') location?: string,
    @Query('search') search?: string,
  ) {
    return this.inventory.list({ category, status, condition, location, search });
  }

  @Get('filters')
  @ApiOperation({ summary: 'Distinct categories/locations in use, for filter dropdowns (ADMIN+)' })
  filters() {
    return this.inventory.filters();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Inventory summary stats (ADMIN+)' })
  stats() {
    return this.inventory.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item with its full history timeline (ADMIN+)' })
  getById(@Param('id') id: string) {
    return this.inventory.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add an inventory item — creates its opening "New" history entry (ADMIN+)' })
  create(@Body() body: CreateInventoryItemDto) {
    return this.inventory.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Edit an item's details (ADMIN+)" })
  update(@Param('id') id: string, @Body() body: UpdateInventoryItemDto) {
    return this.inventory.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item and its history (ADMIN+)' })
  remove(@Param('id') id: string) {
    return this.inventory.remove(id);
  }

  @Post(':id/repairs')
  @ApiOperation({ summary: 'Log a repair against an item (ADMIN+)' })
  logRepair(@Param('id') id: string, @Body() body: LogRepairDto) {
    return this.inventory.logRepair(id, body);
  }

  @Patch(':id/repairs/:historyId')
  @ApiOperation({ summary: 'Edit a logged repair — e.g. mark it completed (ADMIN+)' })
  updateRepair(
    @Param('id') id: string,
    @Param('historyId') historyId: string,
    @Body() body: UpdateRepairDto,
  ) {
    return this.inventory.updateRepair(id, historyId, body);
  }
}
