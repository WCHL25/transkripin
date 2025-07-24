import { Box } from '@mui/material'
import logo from '../assets/img/logo_blue.svg';

const Header = () => {
    return (
        <Box component='header' className="fixed top-0 w-full py-5">
            <Box className="flex justify-between px-5 container mx-auto w-full">
                <Box className="flex items-center gap-2">
                    <img src={logo} alt="" className='w-10' />

                    <span className='font-bold text-lg'>Transkripin</span>
                </Box>
            </Box>
        </Box>
    )
}

export default Header