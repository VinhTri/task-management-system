package com.smartspend.wallet.entity;

import com.smartspend.account.entity.CustomerAccount;
import com.smartspend.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "wallets", indexes = @Index(name = "ix_wallets_account", columnList = "account_id"))
public class Wallet extends BaseEntity {
    public static final String DEFAULT_NAME = "Ví SmartSpend";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false, updatable = false)
    private CustomerAccount account;

    @Column(nullable = false, length = 100, updatable = false)
    private String name;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance;

    @Column(nullable = false, length = 3, updatable = false)
    private String currency;

    @Column(name = "is_default", nullable = false, updatable = false)
    private boolean defaultWallet;

    @Column(nullable = false, updatable = false)
    private boolean locked;

    protected Wallet() {}

    private Wallet(CustomerAccount account) {
        this.account = account;
        this.name = DEFAULT_NAME;
        this.balance = BigDecimal.ZERO;
        this.currency = "VND";
        this.defaultWallet = true;
        this.locked = true;
    }

    public static Wallet createDefault(CustomerAccount account) { return new Wallet(account); }

    public Long getId() { return id; }
    public CustomerAccount getAccount() { return account; }
    public String getName() { return name; }
    public BigDecimal getBalance() { return balance; }
    public String getCurrency() { return currency; }
    public boolean isDefaultWallet() { return defaultWallet; }
    public boolean isLocked() { return locked; }
}
