import { FileTypeFilter, LanguageFilter, SortOrderFilter } from "declarations/backend/backend.did";

export const getFileTypeFilter = (value: string): [FileTypeFilter] | [] => {
   switch (value) {
      case "Video":
         return [{ Video: null }];

      case "Audio":
         return [{ Audio: null }];
      default:
         return [];
   }
};

export const getLanguageFilter = (value: string): [LanguageFilter] | [] => {
   switch (value) {
      case "English":
         return [{ English: null }];

      case "Indonesia":
         return [{ Indonesia: null }];
      default:
         return [];
   }
};

export const getSortFilter = (value: string): [SortOrderFilter] | [] => {
   switch (value) {
      case "Newest":
         return [{ Newest: null }];
      case "Oldest":
         return [{ Oldest: null }];
      case "AlphabeticalAsc":
         return [{ AlphabeticalAsc: null }];
      case "AlphabeticalDesc":
         return [{ AlphabeticalDesc: null }];
      default:
         return [];
   }
};
