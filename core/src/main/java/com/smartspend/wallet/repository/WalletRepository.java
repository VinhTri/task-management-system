package com.smartspend.wallet.repository;

import com.smartspend.wallet.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByAccountIdAndDefaultWalletTrue(
            Long accountId
    );

    @Query("""
        select w
        from Wallet w
        where w.account.user.id = :userId
          and w.defaultWallet = true
    """)
    Optional<Wallet> findDefaultByUserId(
            @Param("userId") Long userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select w
        from Wallet w
        where w.account.user.id = :userId
          and w.defaultWallet = true
    """)
    Optional<Wallet> findDefaultByUserIdForUpdate(
            @Param("userId") Long userId
    );

    @Query("""
        select w
        from Wallet w
        where w.account.accountNumber = :accountNumber
          and w.defaultWallet = true
    """)
    Optional<Wallet> findDefaultByAccountNumber(
            @Param("accountNumber") String accountNumber
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select w
        from Wallet w
        where w.id in :walletIds
        order by w.id asc
    """)
    List<Wallet> findAllByIdForUpdate(
            @Param("walletIds") List<Long> walletIds
    );
}
