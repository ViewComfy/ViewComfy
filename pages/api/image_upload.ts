// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import formidable from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const form = formidable({})
  
  try {
    // const [fields, files] = await form.parse(req)
    const response = await form.parse(req)
    const file = response[1].file?.[0]
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const fileName = `${Date.now()}-${file.originalFilename}`
    const publicPath = path.join(process.cwd(), 'public', 'uploads')
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true })
    }

    // Copy file to public/uploads
    const rawData = fs.readFileSync(file.filepath)
    fs.writeFileSync(path.join(publicPath, fileName), rawData)

    // Return the public URL
    const fileUrl = `/uploads/${fileName}`
    res.status(200).json({ url: fileUrl })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error uploading file' })
  }
}