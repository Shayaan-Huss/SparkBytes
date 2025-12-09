export interface FoodItem {
  id: number;
  event_id: string;
  food_name: string;
  dietary_restrictions: string;
  quantity: number;
  calorie: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  creator_id: string;
  food_items?: FoodItem[];
}