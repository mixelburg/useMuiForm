import {StrictMode} from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import {Box, createTheme, CssBaseline, ThemeProvider} from "@mui/material";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider theme={createTheme({
            palette: {
                mode: 'dark',
                text: {
                    // make it slightly darker that white to make it more readable
                    primary: '#cdcdcd',
                },
            }
        })}>
            <CssBaseline/>
            <Box height='100vh' width='100vw'>
                <App/>
            </Box>
        </ThemeProvider>
    </StrictMode>
)


