/* eslint-disable @next/next/no-img-element */
"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { motion } from "framer-motion";
import type { IViewComfyWorkflow } from "@/app/providers/view-comfy-provider";

export function PreviewOutputsImageGallery({
    viewComfyJSON
}: {
    viewComfyJSON: IViewComfyWorkflow
}) {
    let images = [];
    let image1Path = null;
    let image2Path = null;
    let image3Path = null;

    if (viewComfyJSON.previewImages) {
        images = viewComfyJSON.previewImages.filter((image) => !!image);
        if (images.length === 1) {
            image1Path = images[0];
        } else if (images.length === 2) {
            image1Path = images[0];
            image3Path = images[1];
        } else if (images.length === 3) {
            image1Path = images[0];
            image2Path = images[1];
            image3Path = images[2];
        }
    }

    const [image1, setImage1] = useState<string | null>(image1Path);
    const [image2, setImage2] = useState<string | null>(image2Path);
    const [image3, setImage3] = useState<string | null>(image3Path);

    const first = {
        initial: {
            x: images.length === 1 ? 0 : 20,
            rotate: images.length === 1 ? 0 : -5,
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
        <>
            <motion.div
                initial="initial"
                animate="animate"
                whileHover="hover"
                className="flex w-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-2 items-center justify-center p-4"
            >
                {(image1) && (
                    <motion.div
                        variants={first}
                        className="rounded-md flex items-center justify-center overflow-hidden"
                    >
                        <img
                            src={image1}
                            alt="avatar"
                            className={cn("max-h-[500px] aspect-square object-cover rounded-md transition-all hover:scale-105")}
                            onError={() => {
                                setImage1(null);
                            }}
                        />
                    </motion.div>
                )}
                {(image2) && (
                    <motion.div
                        className="relative z-20 rounded-md flex items-center justify-center overflow-hidden"
                    >
                        <img
                            src={image2}
                            alt="avatar"
                            className={cn("max-h-[500px] aspect-square object-cover rounded-md transition-all hover:scale-105")}
                            onError={() => {
                                setImage2(null);
                            }}
                        />
                    </motion.div>
                )}
                {(image3) && (
                    <motion.div
                        variants={second}
                        className="rounded-md flex items-center justify-center overflow-hidden"
                    >
                        <img
                            src={image3}
                            alt="avatar"
                            className={cn("max-h-[500px] aspect-square object-cover rounded-md transition-all hover:scale-105")}
                            onError={() => {
                                setImage3(null);
                            }}
                        />
                    </motion.div>
                )}
            </motion.div>
            {!(image1 ?? image2 ?? image3) && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center">
                    <span className="text-lg">
                        Click the Generate button to start.
                    </span>
                </div>
            )}
        </>
    );
};
