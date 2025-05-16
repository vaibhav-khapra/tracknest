"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react"

const Navbar = (props) => {
    const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white z-5  fixed w-full top-0 shadow-sm">
      <div className="flex justify-between py-5 px-6 md:px-20 items-center">
        <div>
          
           <span className="font-bold text-2xl md:text-3xl">Tracknest</span>
         
        </div>
        <button
          className="md:hidden focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
        <div className="hidden md:flex gap-5 items-center">
          <ul className='list-none flex justify-center items-center gap-3'>
            {!session && <>
              <li className="hover:text-blue-500 transition-colors"><Link href='/' >Home</Link></li>
            <li className="hover:text-blue-500 transition-colors"><Link href='/features' >Features</Link></li>
            <li className="hover:text-blue-500 transition-colors"><Link href='/' >Pricing</Link></li>
            <li className="hover:text-blue-500 transition-colors"><Link href='/' >Contact</Link></li></>}
            {session && <>
              <li className="hover:text-blue-500 transition-colors"><Link href='/dashboard' >Dashboard</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/profile' >Profile</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/additems' >Add Items</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/allitems' >All Items</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/createbill' >Create Bill</Link></li>

            </>}
            {!session && <button className="px-5 py-3 rounded-lg cursor-pointer  text-white font-semibold bg-blue-400 hover:bg-blue-500 transition-colors">
              <Link href='/login'>Get Started</Link>
            </button> }
            {session && <button onClick={(params) => {
              signOut()
            }
            } className="px-5 py-3 rounded-lg cursor-pointer  text-white font-semibold bg-blue-400 hover:bg-blue-500 transition-colors">
              Sign Out
            </button>}
          
          </ul>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in-down">
          <div className="flex flex-col py-2">
            <ul className='list-none flex flex-col justify-center items-center gap-3'>
            {!session && <>
            
 <li className="hover:text-blue-500 transition-colors"><Link href='/' >Home</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/features' >Features</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/' >Pricing</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/' >Contact</Link></li></>}
            {session && <>
              <li className="hover:text-blue-500 transition-colors"><Link href='/dashboard' >Dashboard</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/profile' >Profile</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/additems' >Add Items</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/allitems' >All Items</Link></li>
              <li className="hover:text-blue-500 transition-colors"><Link href='/createbill' >Create Bill</Link></li>

            </>}
            </ul>
            <div className="px-6 py-3">
              {!session &&
              <button className="w-full px-5 py-3  cursor-pointer  rounded-lg text-white font-semibold bg-blue-400 hover:bg-blue-500 transition-colors">
                <Link href='/login'>Get Started</Link> 
              </button>}
              {session && <button onClick={(params) => {
                signOut()
              }
              } className="w-full px-5 py-3  cursor-pointer  rounded-lg text-white font-semibold bg-blue-400 hover:bg-blue-500 transition-colors">
               Sign Out
              </button>}
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-px bg-black opacity-10"></div>
    </nav>
  );
};

export default Navbar;