import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const navIcons = [
    {id:1 ,src:'/assets/icons/search.svg' , alt: 'search'},
    {id:2,src:'/assets/icons/black-heart.svg' , alt: 'black-heart'},
    {id:3,src:'/assets/icons/user.svg' , alt: 'user'}
]

const Navbar = () => {
  return (
    <div>
      <header className='w-full '>
        <nav className='nav'>
            <Link href='/' className='flex items-center gap-1'>
                <Image src='/assets/icons/logo.svg' width={27} height={27} alt='logo'
                />
                <p className='nav-logo'>Price<span className='text-primary'>wise</span></p>
            </Link>
            <div className='flex items-center gap-5 '>
                {navIcons.map((icon)=>(
                    <Image className='object-contain' key={icon.id} src={icon.src} alt={icon.alt} width={28} height={28}/>
                ))}
            </div>
        </nav>
      </header>
    </div>
  )
}

export default Navbar
