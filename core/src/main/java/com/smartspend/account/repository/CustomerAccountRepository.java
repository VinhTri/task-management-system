package com.smartspend.account.repository;

import com.smartspend.account.entity.CustomerAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerAccountRepository extends JpaRepository<CustomerAccount, Long> {
    Optional<CustomerAccount> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    boolean existsByAccountNumber(String accountNumber);
}
