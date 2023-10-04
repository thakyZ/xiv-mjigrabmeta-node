import { Item as xivApiItem } from "@xivapi/js";

export class Config {
  credentials: { [key: string]: string };
  output: string = "output.json";
  lang: string = undefined;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  constructor(input: any) {
    console.log(`${typeof input}`);
    if (typeof input === "object") {
      /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      if (Object.hasOwn(input, "credentials")) {
        this.credentials = input.credentials;
      }

      if (Object.hasOwn(input, "output")) {
        this.output = input.output;
      }

      if (Object.hasOwn(input, "lang")) {
        this.lang = input.lang;
      }
      /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    }
  }
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

export class Item implements xivApiItem {
  ID: number;
  Name: string;
  /* eslint-disable camelcase */
  Name_de: string;
  Name_en: string;
  Name_fr: string;
  Name_ja: string;
  /* eslint-enable camelcase */

  getName(lang: string): string {
    switch (lang) {
      case "en":
        return this.Name_en;
      case "fr":
        return this.Name_en;
      case "ja":
        return this.Name_en;
      default:
        return this.Name;
    }
  }
}

export class ModuleResult {
  id: number;
  singular: string;

  constructor(_id: number, _singular: string) {
    this.id = _id;
    this.singular = _singular;
  }
}
