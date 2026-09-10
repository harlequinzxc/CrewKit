import React from 'react';
import { MenuItemCard, MenuItemCardProps } from './ui/MenuItemCard';

export interface DishCardProps extends MenuItemCardProps {}

/**
 * DishCard delegates directly to unified MenuItemCard primitive.
 */
export const DishCard: React.FC<DishCardProps> = (props) => {
  return <MenuItemCard {...props} />;
};
