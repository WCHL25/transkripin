export const sortOptions = [
   {
      label: "Newest",
      value: {
         sortBy: "updated_at",
         sort: "desc",
      },
   },
   {
      label: "Oldest",
      value: {
         sortBy: "updated_at",
         sort: "asc",
      },
   },
   {
      label: "Alphabetical (A-Z)",
      value: {
         sortBy: "title",
         sort: "asc",
      },
   },
   {
      label: "Alphabetical (Z-A)",
      value: {
         sortBy: "title",
         sort: "desc",
      },
   },
];

export const typeOptions = [
   {
      label: "All",
      value: "",
   },
   {
      label: "Video",
      value: "video",
   },
   {
      label: "Audio",
      value: "audio",
   },
];

export const languageOptions = [
   {
      label: "All",
      value: "",
   },
   {
      label: "English",
      value: "english",
   },
   {
      label: "Indonesia",
      value: "indonesia",
   },
];
