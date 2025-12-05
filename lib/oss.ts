import OSS from 'ali-oss';

export interface ImageUrl {
  show_url: string;
  download_url: string;
}

class OssService {
  private client: OSS;

  constructor() {
    this.client = new OSS({
      endpoint: process.env.OSS_ENDPOINT || 'oss-cn-hongkong.aliyuncs.com',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET || '',
      cname: true,
    });
  }

  async uploadFile(fileName: string, file: any): Promise<OSS.PutObjectResult> {
    return this.client.put(fileName, file);
  }

  async getFile(fileName: string): Promise<OSS.GetObjectResult> {
    return this.client.get(fileName);
  }

  async deleteFile(fileName: string): Promise<OSS.DeleteResult> {
    return this.client.delete(fileName);
  }

  async getFileUrl(
    fileName: string,
    isForDownload: boolean = false,
  ): Promise<string> {
    const options: OSS.SignatureUrlOptions = { expires: 2 * 60 * 60 };
    const pixivAddr = fileName.split('/').pop();
    if (!pixivAddr) {
      return '';
    }

    try {
      const headerResponse = await this.client.head(fileName);
      const contentLength = Number(
        (headerResponse.res.headers as { 'content-length': string })[
          'content-length'
        ],
      );

      if (isForDownload) {
        options.response = {};
        options.response['content-disposition'] =
          `attachment; filename=${pixivAddr}`;
      } else if (contentLength < 1024 * 1024 * 20) {
        // 过大图片展示的时候无法加样式
        options.process = 'style/sort_image';
      }
    } catch (error) {
      console.error(`Error getting file header for ${fileName}:`, error);
    }

    return this.client.signatureUrl(fileName, options);
  }

  async findUrl(tosFileName: string): Promise<ImageUrl> {
    return {
      show_url: await this.getFileUrl(tosFileName),
      download_url: await this.getFileUrl(tosFileName, true),
    };
  }
}

// 创建单例
let ossService: OssService | null = null;

export function getOssService(): OssService {
  if (!ossService) {
    ossService = new OssService();
  }
  return ossService;
}

export default OssService;
