import * as AWS from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { IFileService } from '../files.adapter.js';
import { S3Lib } from './constants/do-spaces-service-lib.constant.js';
import { RemoveException } from './exceptions/remove.exception.js';
import { UploadException } from './exceptions/upload.exception.js';
import { UploadFilePayloadDto } from './dto/upload-file-payload.dto.js';
import { UploadFileResultDto } from './dto/upload-file-result.dto.js';
import { RemoveFilePayloadDto } from './dto/remove-file-payload.dto.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service extends IFileService {
  private readonly logger = new Logger(S3Service.name);

  private readonly bucketName: string;

  constructor(
    @Inject(S3Lib) private readonly S3: AWS.S3,
    private readonly configService: ConfigService,
  ) {
    super();
    this.bucketName = configService.getOrThrow<string>('S3_BUCKET_NAME');
  }

  async uploadFile(dto: UploadFilePayloadDto): Promise<UploadFileResultDto> {
    const { folder, file, name } = dto;
    const path = `${folder}/${name}`;

    this.logger.log('📁 Beginning of uploading file to bucket');

    return new Promise((resolve, reject) => {
      this.S3.putObject(
        {
          Bucket: this.bucketName,
          Key: path,
          Body: file.buffer,
          ACL: 'public-read',
          ContentType: file.mimetype,
        },
        (error: unknown) => {
          if (!error) {
            this.logger.log('✅ Uploading was successful');
            resolve({
              path,
            });
          } else {
            this.logger.error(`❌ File upload error with path: ${path}`);
            reject(
              new UploadException(
                error instanceof Error ? error.message : undefined,
              ),
            );
          }
        },
      );
    });
  }

  async removeFile(dto: RemoveFilePayloadDto): Promise<void> {
    const { path } = dto;

    this.logger.log('🗑️ Beginning of removing file from bucket');

    return new Promise((resolve, reject) => {
      this.S3.deleteObject(
        {
          Bucket: this.bucketName,
          Key: path,
        },
        (error: unknown) => {
          if (!error) {
            this.logger.log('✅ Removing was successful');
            resolve();
          } else {
            this.logger.error(`❌ File remove error with path: ${path}`);
            reject(
              new RemoveException(
                error instanceof Error ? error.message : undefined,
              ),
            );
          }
        },
      );
    });
  }
}
