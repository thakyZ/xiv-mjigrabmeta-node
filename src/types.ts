export class Config {
  credentials: { [key: string]: string };
  output: string;
  lang: string;
}

export class DataOutput {
  id: number;
  singular: string;
}

export class ReSanctuaryFile {
  $type: string = "ReSanctuary.Configuration, ReSanctuary2";
  Version: number = 1;
  TodoList: Record<string, string | number>[];
  TodoListCreature: Record<string, string | number>[];
  CreatureFilterHide: Array<number>;
  LockWidget: boolean;
}

export class XIVAPIResolution {
  Pagination: XIVAPIPagination;
  Results: { [key: number]: XIVAPIResult };
}

export class XIVAPIResult {
  ID: number;
  Icon: string | null;
  Name: string | null;
  Url: string;
}

export class XIVAPIPagination {
  Page: number;
  PageNext: number | null;
  PagePrev: number | null;
  PageTotal: number | null;
  Results: number;
  ResultsPerPage: number;
  ResultsTotal: number;
}

export class MJIItemPouchEntry {
  Category: { [key: string]: string };
  CategoryTarget: string;
  CategoryTargetID: number;
  Crop: number | null;
  CropTarget: string;
  CropTargetID: number;
  GameContentLinks: { [key: string]: { [key: string]: Array<number> } };
  ID: number;
  Item: { [key: string]: string | number | null | { [key: string]: string | number } };
  ItemTarget: string;
  ItemTargetID: number;
  Patch: Object | null;
  Url: string;
}
