package com.smartspend.customer.account.storage;

import org.springframework.web.multipart.MultipartFile;

public interface AvatarStorage {
    String store(Long userId, MultipartFile file);
    void delete(String avatarUrl);
}
