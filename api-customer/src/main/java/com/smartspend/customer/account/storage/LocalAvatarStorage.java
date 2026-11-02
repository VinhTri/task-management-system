package com.smartspend.customer.account.storage;

import com.smartspend.common.exception.AppException;
import com.smartspend.customer.account.exception.AccountErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@Component
public class LocalAvatarStorage implements AvatarStorage {
    private static final long MAX_SIZE = 2 * 1024 * 1024;
    private static final String PUBLIC_PREFIX = "/avatars/";
    private final Path directory;

    public LocalAvatarStorage(@Value("${smartspend.storage.avatar-directory:./data/avatars}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    @Override
    public String store(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_SIZE) {
            throw new AppException(AccountErrorCode.INVALID_AVATAR);
        }
        try {
            byte[] content = file.getBytes();
            String extension = detectExtension(content);
            String filename = userId + "-" + UUID.randomUUID() + "." + extension;
            Files.createDirectories(directory);
            Path temporary = Files.createTempFile(directory, "avatar-", ".tmp");
            Files.write(temporary, content);
            Path target = directory.resolve(filename);
            try {
                Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException exception) {
                Files.move(temporary, target);
            }
            return PUBLIC_PREFIX + filename;
        } catch (AppException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new AppException(AccountErrorCode.AVATAR_STORAGE_FAILED);
        }
    }

    @Override
    public void delete(String avatarUrl) {
        if (avatarUrl == null || !avatarUrl.startsWith(PUBLIC_PREFIX)) return;
        String filename = avatarUrl.substring(PUBLIC_PREFIX.length());
        if (!filename.equals(Path.of(filename).getFileName().toString())) return;
        try {
            Files.deleteIfExists(directory.resolve(filename));
        } catch (IOException ignored) {
            // File cleanup must not roll back an otherwise valid profile update.
        }
    }

    private String detectExtension(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) {
            return "jpg";
        }
        if (bytes.length >= 8 && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47) {
            return "png";
        }
        if (bytes.length >= 12
                && new String(bytes, 0, 4).toUpperCase(Locale.ROOT).equals("RIFF")
                && new String(bytes, 8, 4).toUpperCase(Locale.ROOT).equals("WEBP")) {
            return "webp";
        }
        throw new AppException(AccountErrorCode.INVALID_AVATAR);
    }
}
