import { compressImageFile } from '@/utils/imageUtils'
import { BASE_API_URL } from '@/constants'

export async function uploadImage(
  file: File
): Promise<{ file_id: string; width: number; height: number; url: string }> {
  // Compress image before upload
  const compressedFile = await compressImageFile(file)

  const formData = new FormData()
  formData.append('file', compressedFile)
  const response = await fetch(`${BASE_API_URL}/api/upload_image`, {
    method: 'POST',
    body: formData,
  })
  return await response.json()
}
