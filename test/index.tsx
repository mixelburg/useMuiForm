import React, {StrictMode} from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import {Box, createTheme, CssBaseline, ThemeProvider} from "@mui/material";


ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider theme={createTheme({
            palette: {
                mode: 'dark',
            }
        })}>
            <CssBaseline />
            <Box height='100vh' width='100vw'>
                <App/>
            </Box>
        </ThemeProvider>
    </StrictMode>
)


