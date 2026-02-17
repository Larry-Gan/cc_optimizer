import type { CategoryNode, CategoryOption } from "../types/category";

const make = (
  id: string,
  label: string,
  children: CategoryNode[] = [],
  networkRestrictions?: string[],
): CategoryNode => ({
  id,
  label,
  parentId: null,
  children,
  networkRestrictions,
});

const tree: CategoryNode[] = [
  make("groceries", "Groceries", [
    make("costco", "Costco"),
    make("wholesale-clubs", "Wholesale Clubs"),
    make("whole-foods", "Whole Foods"),
    make("supermarkets", "Supermarkets"),
  ]),
  make("gas", "Gas", [
    make("costco-gas", "Costco Gas", [], ["Visa"]),
    make("ev-charging", "EV Charging"),
    make("gas-stations", "Gas Stations"),
  ]),
  make("dining", "Dining", [
    make("restaurants", "Restaurants"),
    make("fast-food", "Fast Food"),
    make("bars", "Bars"),
    make("coffee-shops", "Coffee Shops"),
    make("food-delivery", "Food Delivery"),
  ]),
  make("travel", "Travel", [
    make("airlines", "Airlines"),
    make("hotels", "Hotels"),
    make("car-rental", "Car Rental"),
    make("public-transit", "Public Transit"),
    make("rideshare", "Rideshare"),
    make("parking", "Parking"),
    make("tolls", "Tolls"),
    make("travel-portal", "Travel Portal"),
  ]),
  make("online-shopping", "Online Shopping", [
    make("amazon", "Amazon"),
    make("ebay", "eBay"),
    make("walmart-online", "Walmart Online"),
    make("general-online", "General Online"),
  ]),
  make("entertainment", "Entertainment", [
    make("streaming", "Streaming"),
    make("gaming", "Gaming"),
    make("movies-theater", "Movies & Theater"),
    make("live-events", "Live Events"),
  ]),
  make("bills-utilities", "Bills & Utilities", [
    make("phone-bill", "Phone Bill"),
    make("internet", "Internet"),
    make("electric", "Electric"),
    make("water", "Water"),
    make("insurance", "Insurance"),
    make("subscriptions", "Subscriptions"),
  ]),
  make("drugstores-pharmacy", "Drugstores & Pharmacy"),
  make("home-improvement", "Home Improvement", [
    make("hardware-stores", "Hardware Stores"),
    make("furniture", "Furniture"),
  ]),
  make("office-supplies", "Office Supplies"),
  make("gym-fitness", "Gym & Fitness"),
  make("pet", "Pet"),
  make("childcare-education", "Childcare & Education"),
  make("medical", "Medical", [
    make("doctors", "Doctors"),
    make("dental", "Dental"),
    make("vision", "Vision"),
  ]),
  make("clothing", "Clothing"),
  make("electronics", "Electronics"),
  make("other", "Other"),
];

function withParentIds(nodes: CategoryNode[], parentId: string | null): CategoryNode[] {
  return nodes.map((node) => ({
    ...node,
    parentId,
    children: withParentIds(node.children, node.id),
  }));
}

export const categoryTree = withParentIds(tree, null);

export function flattenCategoryTree(nodes = categoryTree, depth = 0): CategoryOption[] {
  return nodes.flatMap((node) => [
    { id: node.id, label: node.label, depth, parentId: node.parentId },
    ...flattenCategoryTree(node.children, depth + 1),
  ]);
}

export function getDescendants(categoryId: string): string[] {
  const visit = (nodes: CategoryNode[]): CategoryNode | undefined => {
    for (const node of nodes) {
      if (node.id === categoryId) return node;
      const found = visit(node.children);
      if (found) return found;
    }
    return undefined;
  };

  const root = visit(categoryTree);
  if (!root) return [];

  const all: string[] = [];
  const walk = (node: CategoryNode) => {
    all.push(node.id);
    node.children.forEach(walk);
  };
  walk(root);
  return all;
}

export const topLevelCategories = categoryTree.map((c) => c.id);

export function getCategoryNode(categoryId: string): CategoryNode | undefined {
  const visit = (nodes: CategoryNode[]): CategoryNode | undefined => {
    for (const node of nodes) {
      if (node.id === categoryId) return node;
      const found = visit(node.children);
      if (found) return found;
    }
    return undefined;
  };

  return visit(categoryTree);
}

export function getAncestorIds(categoryId: string): string[] {
  const ancestors: string[] = [];
  let current = getCategoryNode(categoryId);
  while (current) {
    ancestors.push(current.id);
    current = current.parentId ? getCategoryNode(current.parentId) : undefined;
  }
  return ancestors;
}
