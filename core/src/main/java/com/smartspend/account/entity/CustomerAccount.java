package com.smartspend.account.entity;

import com.smartspend.common.entity.BaseEntity;
import com.smartspend.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "customer_accounts")
public class CustomerAccount extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false, unique = true)
    private User user;

    @Column(name = "account_number", nullable = false, updatable = false, unique = true, length = 12)
    private String accountNumber;

    @Column(name = "pin_hash", nullable = false)
    private String pinHash;

    protected CustomerAccount() {}

    private CustomerAccount(User user, String accountNumber, String pinHash) {
        this.user = user;
        this.accountNumber = accountNumber;
        this.pinHash = pinHash;
    }

    public static CustomerAccount open(User user, String accountNumber, String pinHash) {
        return new CustomerAccount(user, accountNumber, pinHash);
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getAccountNumber() { return accountNumber; }
    public String getPinHash() { return pinHash; }
}
