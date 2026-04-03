export interface Venue {
  id: string;
  name: string;
  address: string;
  description: string;
  pricePerHour: number;
  type: string;
  tags: string[];
  photos: string[];
  rules: string;
}
