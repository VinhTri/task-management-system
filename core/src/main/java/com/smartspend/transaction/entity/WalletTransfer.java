package com.smartspend.transaction.entity;

import com.smartspend.common.entity.BaseEntity;
import com.smartspend.transaction.enums.TransactionStatus;
import com.smartspend.wallet.entity.Wallet;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "wallet_transfers",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_wallet_transfers_reference", columnNames = "reference_code"),
                @UniqueConstraint(
                        name = "uk_wallet_transfers_sender_idempotency",
                        columnNames = {"sender_wallet_id", "idempotency_key"})
        })
public class WalletTransfer extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_code", nullable = false, updatable = false, length = 40)
    private String referenceCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_wallet_id", nullable = false, updatable = false)
    private Wallet senderWallet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_wallet_id", nullable = false, updatable = false)
    private Wallet recipientWallet;

    @Column(name = "idempotency_key", nullable = false, updatable = false, length = 100)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 20)
    private TransactionStatus status;

    @Column(nullable = false, updatable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "sender_balance_before", nullable = false, updatable = false, precision = 19, scale = 2)
    private BigDecimal senderBalanceBefore;

    @Column(name = "sender_balance_after", nullable = false, updatable = false, precision = 19, scale = 2)
    private BigDecimal senderBalanceAfter;

    @Column(name = "recipient_balance_before", nullable = false, updatable = false, precision = 19, scale = 2)
    private BigDecimal recipientBalanceBefore;

    @Column(name = "recipient_balance_after", nullable = false, updatable = false, precision = 19, scale = 2)
    private BigDecimal recipientBalanceAfter;

    @Column(length = 255, updatable = false)
    private String description;

    protected WalletTransfer() {}

    public static WalletTransfer success(
            String referenceCode,
            Wallet senderWallet,
            Wallet recipientWallet,
            String idempotencyKey,
            BigDecimal amount,
            BigDecimal senderBalanceBefore,
            BigDecimal senderBalanceAfter,
            BigDecimal recipientBalanceBefore,
            BigDecimal recipientBalanceAfter,
            String description) {
        WalletTransfer transfer = new WalletTransfer();
        transfer.referenceCode = referenceCode;
        transfer.senderWallet = senderWallet;
        transfer.recipientWallet = recipientWallet;
        transfer.idempotencyKey = idempotencyKey;
        transfer.status = TransactionStatus.SUCCESS;
        transfer.amount = amount;
        transfer.senderBalanceBefore = senderBalanceBefore;
        transfer.senderBalanceAfter = senderBalanceAfter;
        transfer.recipientBalanceBefore = recipientBalanceBefore;
        transfer.recipientBalanceAfter = recipientBalanceAfter;
        transfer.description = description;
        return transfer;
    }

    public Long getId() { return id; }
    public String getReferenceCode() { return referenceCode; }
    public Wallet getSenderWallet() { return senderWallet; }
    public Wallet getRecipientWallet() { return recipientWallet; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public TransactionStatus getStatus() { return status; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getSenderBalanceBefore() { return senderBalanceBefore; }
    public BigDecimal getSenderBalanceAfter() { return senderBalanceAfter; }
    public BigDecimal getRecipientBalanceBefore() { return recipientBalanceBefore; }
    public BigDecimal getRecipientBalanceAfter() { return recipientBalanceAfter; }
    public String getDescription() { return description; }
}
