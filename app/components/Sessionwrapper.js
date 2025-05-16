"use client"
import React from 'react'
import { SessionProvider } from "next-auth/react"

const Sessionwrapper = ({ children }) => {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    )
}

export default Sessionwrapper
