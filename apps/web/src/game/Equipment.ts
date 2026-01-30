import {
  EquipmentItem,
  EquipmentSlots,
  EquipmentSlotType,
} from '@larn-like/shared';

export function createEmptySlots(): EquipmentSlots {
  return {
    weapon: null,
    offHand: null,
    helmet: null,
    bodyArmor: null,
    gloves: null,
    boots: null,
    ring1: null,
    ring2: null,
    amulet: null,
    belt: null,
  };
}

export function createStartingDagger(ownerName: string): EquipmentItem {
  return {
    id: `dagger_${ownerName.toLowerCase().replace(/\s/g, '_')}`,
    name: `${ownerName}'s Dagger`,
    slot: 'weapon',
    attackBonus: 2,
    defenseBonus: 0,
    description: 'A basic iron dagger',
  };
}

export function createStartingShirt(ownerName: string): EquipmentItem {
  return {
    id: `shirt_${ownerName.toLowerCase().replace(/\s/g, '_')}`,
    name: `${ownerName}'s Shirt`,
    slot: 'bodyArmor',
    attackBonus: 0,
    defenseBonus: 1,
    description: 'A simple cloth shirt',
  };
}

export function createStartingEquipment(ownerName: string): EquipmentSlots {
  const slots = createEmptySlots();
  slots.weapon = createStartingDagger(ownerName);
  slots.bodyArmor = createStartingShirt(ownerName);
  return slots;
}

export function isSlotOccupied(slots: EquipmentSlots, slot: EquipmentSlotType): boolean {
  return slots[slot as keyof EquipmentSlots] !== null;
}

export function getEquippedItems(slots: EquipmentSlots): EquipmentItem[] {
  const items: EquipmentItem[] = [];
  const keys: EquipmentSlotType[] = [
    'weapon', 'offHand', 'helmet', 'bodyArmor', 'gloves',
    'boots', 'ring1', 'ring2', 'amulet', 'belt',
  ];
  for (const key of keys) {
    const item = slots[key as keyof EquipmentSlots];
    if (item) {
      items.push(item);
    }
  }
  return items;
}

export function getTotalAttackBonus(slots: EquipmentSlots): number {
  return getEquippedItems(slots).reduce((sum, item) => sum + item.attackBonus, 0);
}

export function getTotalDefenseBonus(slots: EquipmentSlots): number {
  return getEquippedItems(slots).reduce((sum, item) => sum + item.defenseBonus, 0);
}
