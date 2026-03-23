/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number;
  y: number;
}

export interface Opening {
  id: string;
  type: 'window' | 'door';
  position: number; // 0 to 1 along the wall (percentage from start)
  width: number;
  height: number;
  bottomHeight: number; // height from floor
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  height: number;
  openings?: Opening[];
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  walls: Wall[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  isPublic: boolean;
  price?: number;
  marketingDescription?: string;
  thumbnailUrl?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  role: 'architect' | 'buyer';
}
