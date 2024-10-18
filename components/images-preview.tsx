"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export function BentoGridThirdDemo() {

    const first = {
        initial: {
            x: 20,
            rotate: -5,
        },
        hover: {
            x: 0,
            rotate: 0,
        },
    };
    const second = {
        initial: {
            x: -20,
            rotate: 5,
        },
        hover: {
            x: 0,
            rotate: 0,
        },
    };
    return (
        <motion.div
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="flex w-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-2 items-center justify-center p-4"
        >
            <motion.div
                variants={first}
                className="rounded-md bg-white dark:bg-black dark:border-white/[0.1] flex items-center justify-center overflow-hidden"
            >
                <img
                    src="/view_comfy_logo.svg"
                    alt="avatar"
                    className={cn("w-auto h-auto max-w-[300px] max-h-[300px] object-contain rounded-md transition-all hover:scale-105")}
                />
            </motion.div>
            <motion.div 
                className="relative z-20 rounded-md bg-white dark:bg-black dark:border-white/[0.1] borde flex items-center justify-center overflow-hidden"
            >
                <img
                    src="/view_comfy_logo.svg"
                    alt="avatar"
                    className={cn("w-auto h-auto max-w-[300px] max-h-[300px] object-contain rounded-md transition-all hover:scale-105")}
                />
            </motion.div>
            <motion.div
                variants={second}
                className="rounded-md bg-white dark:bg-black dark:border-white/[0.1] borderflex items-center justify-center overflow-hidden"
            >
                <img
                    src="/view_comfy_logo.svg"
                    alt="avatar"
                    className={cn("w-auto h-auto max-w-[300px] max-h-[300px] object-contain rounded-md transition-all hover:scale-105")}
                />
            </motion.div>
        </motion.div>
    );
};
