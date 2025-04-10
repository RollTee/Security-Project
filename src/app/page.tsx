"use client";

import { useState, useEffect } from "react";

export default function ImagesPage() {
    const [images, setImages] = useState<any[]>([]); // State to store images
    const [uploadTime, setUploadTime] = useState<number | null>(null); // State to store upload time
    const [error, setError] = useState<string | null>(null); // State to store errors

    // Fetch all images from the backend
    useEffect(() => {
        fetch("http://localhost:3030/")
            .then((res) => res.json())
            .then((data) => setImages(data))
            .catch((err) => setError("Failed to fetch images"));
    }, []);

    // Handle file upload
    const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const startTime = performance.now();

        try {
            const response = await fetch("http://localhost:3030/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to upload image");
            }

            const endTime = performance.now();
            setUploadTime(endTime - startTime);

            // Refresh the image list
            const updatedImages = await fetch("http://localhost:3030/").then((res) => res.json());
            setImages(updatedImages);
        } catch (err) {
            setError("Failed to upload image");
        }
    };

    // Handle image download
    const handleDownload = (imageID: number) => {
        window.location.href = `http://localhost:3030/download/${imageID}`;
    };

    return (
        <div>
            <nav>
                <a href="/" className="logo">
                    <img id="logo-btn" src="/static/img/logo.png" alt="Logo" />
                </a>
            </nav>

            <div className="container">
                <h1>Upload Image</h1>
                <form onSubmit={handleUpload} encType="multipart/form-data">
                    <input type="file" name="file" required />
                    <button type="submit">Upload</button>
                </form>
                {uploadTime && (
                    <p>Image uploaded and encrypted in {uploadTime.toFixed(2)} milliseconds</p>
                )}
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>

            <div className="all-img">
                <h1>All Images</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Image ID</th>
                            <th>Image</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {images.map((image) => (
                            <tr key={image.id}>
                                <td>{image.id}</td>
                                <td>
                                    <img
                                        src={`data:image/jpeg;base64,${image.data}`}
                                        alt="Image"
                                        style={{ width: "100px" }}
                                    />
                                </td>
                                <td>
                                    <button onClick={() => handleDownload(image.id)}>Download</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}