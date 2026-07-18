import { BookOpen, Bot, Calendar, DollarSign, Heart, Home, PenLine, Settings, Share2, UserRound, Bell, Library, Boxes } from "lucide-react";

export const creatorRoutes = {
  today: "/performer/creator-os",
  create: "/performer/create",
  library: "/performer/library",
  fans: "/performer/fans",
  money: "/performer/money",
  ai: "/performer/ai-producer",
  calendar: "/performer/calendar",
  me: "/performer/profile",
  settings: "/performer/profile?panel=settings",
  notifications: "/performer/profile?panel=notifications",
  share: "/performer/profile?panel=share"
};

export const routeSpaces = {
  "/performer/creator-os": "today",
  "/performer/create": "create",
  "/performer/library": "library",
  "/performer/fans": "fans",
  "/performer/money": "money",
  "/performer/ai-producer": "ai",
  "/performer/calendar": "calendar",
  "/performer/profile": "me",
  "/performer/dashboard": "today"
};

export const creatorNav = [[Home,"Today","today"],[PenLine,"Create","create"],[BookOpen,"Library","library"],[Heart,"Fans","fans"],[DollarSign,"Money","money"],[Bot,"AI Producer","ai"],[Calendar,"Calendar","calendar"],[UserRound,"Me","me"]];
export const utilityIcons = { Settings, Bell, Share2, Library, Boxes };