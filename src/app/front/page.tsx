"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt,faCheckCircle } from '@fortawesome/free-solid-svg-icons';


export default function Home() {
    const [images, setImages] = useState<any[]>([]);
    const [uploadTime, setUploadTime] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showRecent, setShowRecent] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch("http://localhost:3030/")
            .then((res) => res.json())
            .then((data) => setImages(data))
            .catch(() => setError("Failed to fetch images"));
    }, []);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) setSelectedFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    const handleClickBrowse = () => {
        fileInputRef.current?.click();
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("file", selectedFile);
        const startTime = performance.now();

        try {
            const response = await fetch("http://localhost:3030/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");

            const endTime = performance.now();
            setUploadTime(endTime - startTime);

            const updatedImages = await fetch("http://localhost:3030/").then((res) => res.json());
            setImages(updatedImages);
            setError(null);
            setSelectedFile(null);
            setShowRecent(true);

            // Auto hide the recent section after 5 seconds
            setTimeout(() => setShowRecent(false), 5000);
        } catch {
            setError("Failed to upload image");
        }
    };

    const handleDownload = (imageID: number) => {
        window.location.href = `http://localhost:3030/download/${imageID}`;
    };

    const recentImage = images[images.length - 1];

    return (
        <div className="bg-gray-200 min-h-screen flex flex-col items-center">
            {/* Header */}
            <header className="w-full bg-gray-300 p-6 flex justify-between items-center">
                <div className="text-4xl font-bold text-black">Logo</div>
                <nav className="space-x-4">
                    <a href="/front" className="text-xl text-black">Upload</a>
                    <a href="#" className="text-xl text-black">All images</a>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex flex-col items-center mt-8 w-full px-4">
                <div className="bg-white p-15 rounded-lg shadow-md w-full max-w-lg">
                <h1 className="text-2xl font-bold text-center mb-4 text-black">Please upload image to encryption</h1>
                    <div
                        className={`border-2 border-dashed p-12 mb-4 flex flex-col items-center justify-center rounded transition-all ${
                            isDragging ? "border-green-500 bg-green-50" : "border-black"
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                            <FontAwesomeIcon icon={faCloudUploadAlt} className="text-4xl mb-4 text-black" />
                            <p className="mb-4 text-black">Choose a file or drag & drop it here</p>
                            <button
                            type="button"
                            onClick={handleClickBrowse}
                            className="bg-gray-200 text-black py-2 px-4 rounded"
                            >
                                Browse File
                            </button>
                        
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {selectedFile && (
                            <p className="mt-4 text-sm text-green-600">
                                Selected: {selectedFile.name}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile}
                        className={`w-full py-2 px-4 rounded text-white ${
                            selectedFile ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"
                        }`}
                    >
                        Upload
                    </button>

                    {uploadTime && (
                        <p className="text-green-600 text-center mt-2">
                            Uploaded in {uploadTime.toFixed(2)} ms
                        </p>
                    )}
                    {error && (
                        <p className="text-red-600 text-center mt-2">{error}</p>
                    )}
                </div>

                {/* Recent Upload with fade-in/fade-out animation */}
                {recentImage && (
                    <div
                        className={`fixed inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out transform ${
                            showRecent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
                        }`}
                    >
                        {/* Background overlay with blur and semi-transparent effect */}
                        <div className="absolute inset-0  bg-opacity-50 backdrop-blur-sm"></div>

                        {/* Modal content */}
                        <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-lg relative z-10 border-2 border-green-500">
                            <button
                                onClick={() => setShowRecent(false)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                            <h2 className="text-xl font-bold mb-4 text-black text-center">Recent Upload</h2>
                            <div className="flex items-center justify-between bg-gray-100 p-4 rounded">
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-2xl mr-4" />
                                    <div>
                                        <p>{recentImage.name || `Image ID ${recentImage.id}`}</p>
                                        <p className="text-gray-500 text-sm">上传成功 - Completed</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownload(recentImage.id)}
                                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* View All Images Button */}
                <button className="bg-green-500 text-white py-2 px-4 rounded mt-8">
                    Click to see all images
                </button>
            </main>
        </div>
    );
}
