 
"use client";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import type { IViewComfyWorkflow } from "@/app/providers/view-comfy-provider";

export function PreviewOutputsImageGallery({
    viewComfyJSON
}: {
    viewComfyJSON: IViewComfyWorkflow
}) {
    const [image1, setImage1] = useState<string | null>(null);
    const [image2, setImage2] = useState<string | null>(null);
    const [image3, setImage3] = useState<string | null>(null);
    const [first, setFirst] = useState<Variants | undefined>({});
    const [second, setSecond] = useState<Variants | undefined>({});

    useEffect(() => {
        let images = [];
        if (viewComfyJSON.previewImages) {
            images = viewComfyJSON.previewImages.filter((image) => !!image);
            if (images.length === 1) {
                setImage1(images[0]);
                setImage2(null);
                setImage3(null);
            } else if (images.length === 2) {
                setImage1(images[0]);
                setImage2(null);
                setImage3(images[1]);
            } else if (images.length === 3) {
                setImage1(images[0]);
                setImage2(images[1]);
                setImage3(images[2]);
            }
        }

        setFirst({
            initial: {
                x: images.length === 1 ? 0 : 20,
                rotate: images.length === 1 ? 0 : -5,
            },
            hover: {
                x: 0,
                rotate: 0,
            },
        });
        setSecond({
            initial: {
                x: -20,
                rotate: 5,
            },
            hover: {
                x: 0,
                rotate: 0,
            },
        });
    }, [viewComfyJSON]);

    return (
        <>
            <motion.div
                initial="initial"
                animate="animate"
                whileHover="hover"
                className="flex w-full min-h-24 dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-2 items-center justify-center p-4"
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
