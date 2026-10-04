package com.smartspend.transaction.entity;

import com.smartspend.common.entity.BaseEntity;
import com.smartspend.transaction.enums.TransactionStatus;
import com.smartspend.transaction.enums.TransactionType;
import com.smartspend.wallet.entity.Wallet;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "wallet_transactions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_wallet_transactions_reference",
                        columnNames = "reference_code"
                ),
                @UniqueConstraint(
                        name = "uk_wallet_transactions_idempotency",
                        columnNames = {
                                "wallet_id",
                                "idempotency_key"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "ix_wallet_transactions_wallet_created",
                        columnList = "wallet_id, created_at"
                ),
                @Index(
                        name = "ix_wallet_transactions_type",
                        columnList = "transaction_type"
                )
        }
)
public class WalletTransaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "wallet_id",
            nullable = false,
            updatable = false
    )
    private Wallet wallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_id", updatable = false)
    private WalletTransfer transfer;

    @Column(
            name = "reference_code",
            nullable = false,
            updatable = false,
            length = 40
    )
    private String referenceCode;

    @Column(
            name = "idempotency_key",
            nullable = false,
            updatable = false,
            length = 100
    )
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "transaction_type",
            nullable = false,
            updatable = false,
            length = 20
    )
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            updatable = false,
            length = 20
    )
    private TransactionStatus status;

    @Column(
            nullable = false,
            updatable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal amount;

    @Column(
            name = "balance_before",
            nullable = false,
            updatable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal balanceBefore;

    @Column(
            name = "balance_after",
            nullable = false,
            updatable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal balanceAfter;

    @Column(
            length = 255,
            updatable = false
    )
    private String description;

    protected WalletTransaction() {
    }

    private WalletTransaction(
            Wallet wallet,
            String referenceCode,
            String idempotencyKey,
            TransactionType type,
            BigDecimal amount,
            BigDecimal balanceBefore,
            BigDecimal balanceAfter,
            String description
    ) {
        this.wallet = wallet;
        this.referenceCode = referenceCode;
        this.idempotencyKey = idempotencyKey;
        this.type = type;
        this.status = TransactionStatus.SUCCESS;
        this.amount = amount;
        this.balanceBefore = balanceBefore;
        this.balanceAfter = balanceAfter;
        this.description = description;
    }

    public static WalletTransaction success(
            Wallet wallet,
            String referenceCode,
            String idempotencyKey,
            TransactionType type,
            BigDecimal amount,
            BigDecimal balanceBefore,
            BigDecimal balanceAfter,
            String description
    ) {
        return new WalletTransaction(
                wallet,
                referenceCode,
                idempotencyKey,
                type,
                amount,
                balanceBefore,
                balanceAfter,
                description
        );
    }

    public static WalletTransaction transferEntry(
            Wallet wallet,
            WalletTransfer transfer,
            String referenceCode,
            String idempotencyKey,
            TransactionType type,
            BigDecimal amount,
            BigDecimal balanceBefore,
            BigDecimal balanceAfter,
            String description
    ) {
        WalletTransaction transaction = new WalletTransaction(
                wallet,
                referenceCode,
                idempotencyKey,
                type,
                amount,
                balanceBefore,
                balanceAfter,
                description
        );
        transaction.transfer = transfer;
        return transaction;
    }

    public Long getId() {
        return id;
    }

    public Wallet getWallet() {
        return wallet;
    }

    public WalletTransfer getTransfer() {
        return transfer;
    }

    public String getReferenceCode() {
        return referenceCode;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public TransactionType getType() {
        return type;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public BigDecimal getBalanceBefore() {
        return balanceBefore;
    }

    public BigDecimal getBalanceAfter() {
        return balanceAfter;
    }

    public String getDescription() {
        return description;
    }
}
