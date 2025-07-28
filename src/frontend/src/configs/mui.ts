import { createTheme } from "@mui/material";

const theme = createTheme({
    typography: {
        fontFamily: '"Nunito", sans-serif',
        allVariants: {
            textTransform: 'none',
        },
    },
    palette: {
      primary: {
         light: "#278ee3",
         main: "#1A84DB",
         dark: "#167acc",
         contrastText: "#FDFDFD",
      },
      secondary: {
         light: "#292e45",
         main: "#1e2337",
         dark: "#171c2e",
         contrastText: "#FDFDFD",
      },
   }
})

export default theme;