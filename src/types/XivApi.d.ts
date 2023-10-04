declare module "@xivapi/js" {

  export class Resolution {
    Pagination: Pagination;
    Results: { [key: number]: Result };
  }

  export class Result {
    ID: number;
    Icon: string | null;
    Name: string | null;
    Url: string;
  }

  export class Pagination {
    Page: number;
    PageNext: number | null;
    PagePrev: number | null;
    PageTotal: number | null;
    Results: number;
    ResultsPerPage: number;
    ResultsTotal: number;
  }

  /* eslint-disable-next-line no-unused-vars */
  export type DataGetFunction = (content: string, id: string) => Promise<MJIItemPouchEntry> | Promise<undefined>;
  /* eslint-disable-next-line no-unused-vars */
  export type DataListFunction = (content: string) => Promise<Resolution> | Promise<undefined>;

  export class Data {
    get: DataGetFunction;
    list: DataListFunction;
  }

  export interface Item {
    ID: number;
    Name: string;
    Name_de: string;
    Name_en: string;
    Name_fr: string;
    Name_ja: string;
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
    Item: Item;
    ItemTarget: string;
    ItemTargetID: number;
    Patch: { [key: string]: string | number | null } | null;
    Url: string;
  }

  export class XivApi {
    data: Data;
    constructor(_properties: ConstructorProperties);
  }

  export class ConstructorProperties {
    language: string;
    /* eslint-disable camelcase */
    snake_case: boolean;
    private_key: string | undefined;
    /* eslint-enable camelcase */
  }
}

