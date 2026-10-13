import { UploadFilePayloadDto } from './s3/dto/upload-file-payload.dto.js';
import { UploadFileResultDto } from './s3/dto/upload-file-result.dto.js';
import { RemoveFilePayloadDto } from './s3/dto/remove-file-payload.dto.js';
import { RemoveManyFilesPayloadDto } from './s3/dto/remove-many-files-payload.dto.js';

export abstract class IFileService {
  abstract uploadFile(dto: UploadFilePayloadDto): Promise<UploadFileResultDto>;

  abstract removeFile(dto: RemoveFilePayloadDto): Promise<void>;

  abstract removeManyFiles(dto: RemoveManyFilesPayloadDto): Promise<void>;
}
