import { Box, CircularProgress } from "@mui/material"

const Loading = () => {
  return (
    <Box className="h-dvh grid place-items-center">
        <CircularProgress />
    </Box>
  )
}

export default Loading