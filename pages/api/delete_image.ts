import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'DELETE') {
        const { url } = JSON.parse(req.body)

        if (!url) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        // Construct the full path to the image file
        const filePath = path.join(process.cwd(), 'public', url);
        console.log("image url",url)
        console.log("image to delete",filePath)
        try {
            // Check if the file exists
            if (fs.existsSync(filePath)) {
                // Delete the file
                fs.unlinkSync(filePath);
                return res.status(200).json({ message: 'Image deleted successfully' });
            } else {
                return res.status(404).json({ error: 'Image not found' });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            return res.status(500).json({ error: 'Image deletion failed' });
        }
    } else {
        // Handle any other HTTP method
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}