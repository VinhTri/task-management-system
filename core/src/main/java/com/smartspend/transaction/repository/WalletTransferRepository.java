package com.smartspend.transaction.repository;

import com.smartspend.transaction.entity.WalletTransfer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WalletTransferRepository extends JpaRepository<WalletTransfer, Long> {
    Optional<WalletTransfer> findBySenderWalletIdAndIdempotencyKey(
            Long senderWalletId, String idempotencyKey);
}
