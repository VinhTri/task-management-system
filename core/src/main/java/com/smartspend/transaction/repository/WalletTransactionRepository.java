package com.smartspend.transaction.repository;

import com.smartspend.transaction.entity.WalletTransaction;
import com.smartspend.transaction.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WalletTransactionRepository
        extends JpaRepository<WalletTransaction, Long> {

    Optional<WalletTransaction>
    findByWalletIdAndIdempotencyKey(
            Long walletId,
            String idempotencyKey
    );

    Page<WalletTransaction>
    findAllByWalletIdOrderByCreatedAtDesc(
            Long walletId,
            Pageable pageable
    );

    Page<WalletTransaction>
    findAllByWalletIdAndTypeOrderByCreatedAtDesc(
            Long walletId,
            TransactionType type,
            Pageable pageable
    );
}
