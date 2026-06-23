'use client';

import { useState, useEffect } from 'react';

type ChildItem = { href: string };
type NavGroupItem = { label: string; children?: ChildItem[] };
type NavGroup = { items: NavGroupItem[] };

export function useNavDropdown(
  pathname: string | null,
  visibleGroups: NavGroup[],
  isActive: (path: string) => boolean
) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    for (const group of visibleGroups) {
      for (const it of group.items) {
        if (it.children?.some((c) => isActive(c.href))) {
          setOpenDropdown(it.label);
          return;
        }
      }
    }
  }, [pathname]);

  return { openDropdown, setOpenDropdown };
}
