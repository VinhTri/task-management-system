package com.smartspend.customer.wallet.service.impl;

import com.smartspend.account.entity.CustomerAccount;
import com.smartspend.customer.account.service.CustomerAccountService;
import com.smartspend.customer.wallet.dto.InternalTransferRequest;
import com.smartspend.customer.wallet.dto.InternalTransferResponse;
import com.smartspend.customer.wallet.dto.WalletOperationRequest;
import com.smartspend.customer.wallet.dto.WalletTransactionResponse;
import com.smartspend.transaction.entity.WalletTransaction;
import com.smartspend.transaction.entity.WalletTransfer;
import com.smartspend.transaction.enums.TransactionType;
import com.smartspend.transaction.repository.WalletTransactionRepository;
import com.smartspend.transaction.repository.WalletTransferRepository;
import com.smartspend.wallet.entity.Wallet;
import com.smartspend.wallet.repository.WalletRepository;
import com.smartspend.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletTransactionServiceImplTest {

    @Mock
    private WalletRepository wallets;

    @Mock
    private WalletTransactionRepository transactions;

    @Mock
    private WalletTransferRepository transfers;

    @Mock
    private CustomerAccountService accountService;

    private WalletTransactionServiceImpl service;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        service = new WalletTransactionServiceImpl(wallets, transactions, transfers, accountService);
        wallet = Wallet.createDefault(null);
        wallet.deposit(new BigDecimal("700000.00"));
    }

    @Test
    void withdrawShouldUpdateBalanceAndCreateTransaction() {
        when(wallets.findDefaultByUserIdForUpdate(1L)).thenReturn(Optional.of(wallet));
        when(transactions.findByWalletIdAndIdempotencyKey(wallet.getId(), "request-1"))
                .thenReturn(Optional.empty());
        when(transactions.save(any(WalletTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WalletTransactionResponse response = service.withdraw(
                1L,
                "request-1",
                new WalletOperationRequest(new BigDecimal("500000.00"), "135790", "Rút tiền"));

        assertEquals(0, new BigDecimal("200000.00").compareTo(wallet.getBalance()));
        assertEquals(0, new BigDecimal("700000.00").compareTo(response.balanceBefore()));
        assertEquals(0, new BigDecimal("200000.00").compareTo(response.balanceAfter()));
        assertEquals(TransactionType.WITHDRAWAL.name(), response.type());
        verify(accountService).verifyTransactionPin(1L, "135790");
        verify(transactions).save(any(WalletTransaction.class));
    }

    @Test
    void withdrawShouldKeepBalanceWhenFundsAreInsufficient() {
        when(wallets.findDefaultByUserIdForUpdate(1L)).thenReturn(Optional.of(wallet));
        when(transactions.findByWalletIdAndIdempotencyKey(wallet.getId(), "request-2"))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.withdraw(
                1L,
                "request-2",
                new WalletOperationRequest(new BigDecimal("800000.00"), "135790", null)));

        assertEquals(0, new BigDecimal("700000.00").compareTo(wallet.getBalance()));
        verify(transactions, never()).save(any());
    }

    @Test
    void retryShouldReturnExistingTransactionWithoutChangingBalance() {
        WalletTransaction existing = WalletTransaction.success(
                wallet,
                "TXN-EXISTING",
                "request-3",
                TransactionType.WITHDRAWAL,
                new BigDecimal("500000.00"),
                new BigDecimal("700000.00"),
                new BigDecimal("200000.00"),
                "Rút tiền");

        when(wallets.findDefaultByUserIdForUpdate(1L)).thenReturn(Optional.of(wallet));
        when(transactions.findByWalletIdAndIdempotencyKey(wallet.getId(), "request-3"))
                .thenReturn(Optional.of(existing));

        WalletTransactionResponse response = service.withdraw(
                1L,
                "request-3",
                new WalletOperationRequest(new BigDecimal("500000.00"), "135790", "Rút tiền"));

        assertEquals("TXN-EXISTING", response.referenceCode());
        assertEquals(0, new BigDecimal("700000.00").compareTo(wallet.getBalance()));
        verify(transactions, never()).save(any());
    }

    @Test
    void transferShouldMoveMoneyAndCreateTwoLedgerEntries() {
        Wallet sender = wallet(10L, "111111111111", "700000.00");
        Wallet recipient = wallet(20L, "222222222222", "100000.00");
        when(wallets.findDefaultByUserId(1L)).thenReturn(Optional.of(sender));
        when(wallets.findDefaultByAccountNumber("222222222222")).thenReturn(Optional.of(recipient));
        when(wallets.findAllByIdForUpdate(List.of(10L, 20L))).thenReturn(List.of(sender, recipient));
        when(transfers.findBySenderWalletIdAndIdempotencyKey(10L, "transfer-1"))
                .thenReturn(Optional.empty());
        when(transfers.save(any(WalletTransfer.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(transactions.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        InternalTransferResponse response = service.transfer(
                1L,
                "transfer-1",
                new InternalTransferRequest(
                        "222222222222", new BigDecimal("500000.00"), "135790", "Chuyển tiền"));

        assertEquals(0, new BigDecimal("200000.00").compareTo(sender.getBalance()));
        assertEquals(0, new BigDecimal("600000.00").compareTo(recipient.getBalance()));
        assertEquals("111111111111", response.senderAccountNumber());
        assertEquals("222222222222", response.recipientAccountNumber());
        verify(transactions).saveAll(any());
    }

    @Test
    void transferShouldRejectSelfTransfer() {
        Wallet sender = wallet(10L, "111111111111", "700000.00");
        when(wallets.findDefaultByUserId(1L)).thenReturn(Optional.of(sender));
        when(wallets.findDefaultByAccountNumber("111111111111")).thenReturn(Optional.of(sender));

        assertThrows(RuntimeException.class, () -> service.transfer(
                1L,
                "transfer-self",
                new InternalTransferRequest(
                        "111111111111", new BigDecimal("1000.00"), "135790", null)));

        verify(wallets, never()).findAllByIdForUpdate(any());
    }

    private Wallet wallet(Long id, String accountNumber, String balance) {
        User user = User.customer(accountNumber + "@example.com", "password-hash");
        CustomerAccount account = CustomerAccount.open(user, accountNumber, "pin-hash");
        Wallet result = Wallet.createDefault(account);
        ReflectionTestUtils.setField(result, "id", id);
        result.deposit(new BigDecimal(balance));
        return result;
    }
}
