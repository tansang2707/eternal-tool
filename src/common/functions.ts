import { WASTE_BLACKLIST } from "./contants";

export const sleep = (ms = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const lowerCase = (value: string) => {
  return value ? value.toLowerCase() : value;
};

export const upperCase = (value: string) => {
  return value ? value.toUpperCase() : value;
};

export const upperCaseFirstLetter = (value: string) => {
  if (!value) return value;
  const upper = value.replace(/^\w/, (chr) => chr.toUpperCase());
  return upper;
};

export const upperCaseAfterSpace = (value: string) => {
  const splitStr = value.toLowerCase().split(" ");
  const upperStr = splitStr.map((item) => upperCaseFirstLetter(item));
  return upperStr.join(" ");
};

export const onlyUnique = (value: any, index: number, self: any) => {
  return self.indexOf(value) === index;
};

export const sortWaste = (a: string, b: string) => {
  if (WASTE_BLACKLIST.includes(a) && !WASTE_BLACKLIST.includes(b)) {
    return 1;
  }
  return -1;
};
