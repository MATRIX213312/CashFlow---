import { useState } from 'react';
import Logo from '../assets/logo-CASHFLOW.jpg';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div>
            <header className='bg-[#071021] w-[390px] h-[844px] m-auto mt-[80px] relative'>
                <nav className='flex flex-col justify-center items-center pt-[20px]'>
                    <img className='w-[100px]' src={Logo} alt="CashFlow" />

                    <button
                        className='mt-[18px] flex flex-col justify-between w-[34px] h-[24px] relative z-50 focus:outline-none'
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        type='button'
                    >
                        <span
                            className={`block w-full h-[3px] bg-white rounded-full transition-all duration-300 ease-in-out origin-center ${isMenuOpen ? 'rotate-45 translate-y-[10.5px]' : ''
                                }`}
                        ></span>

                        <span
                            className={`block w-full h-[3px] bg-white rounded-full transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-0 translate-x-3' : ''
                                }`}
                        ></span>

                        <span
                            className={`block w-full h-[3px] bg-white rounded-full transition-all duration-300 ease-in-out origin-center ${isMenuOpen ? '-rotate-45 -translate-y-[10.5px]' : ''
                                }`}
                        ></span>
                    </button>

                    <div
                        className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col items-center w-full ${isMenuOpen ? 'max-h-[300px] opacity-100 mt-[28px]' : 'max-h-0 opacity-0 mt-0'
                            }`}
                    >
                        <ul className='flex flex-col justify-center items-center gap-[18px] text-white text-[18px] w-full'>
                            <li className='hover:text-[#6366F1] transition-colors'><a href="#">📊 Дашборд</a></li>
                            <li className='hover:text-[#10B981] transition-colors'><a href="#">📈 Доходы</a></li>
                            <li className='hover:text-[#EF4444] transition-colors'><a href="#">📉 Расходы</a></li>
                            <li className='hover:text-[#6366F1] transition-colors'><a href="#">🔄 Транзакции</a></li>
                            <li className='hover:text-gray-400 transition-colors'><a href="#">⚙️ Настройки</a></li>
                        </ul>
                    </div>
                </nav>
            </header>
        </div>
    );
}

export default Header;