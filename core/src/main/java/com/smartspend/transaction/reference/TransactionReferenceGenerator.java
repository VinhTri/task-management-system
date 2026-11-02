package com.smartspend.transaction.reference;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TransactionReferenceGenerator {

    private static final String TRANSACTION_PREFIX = "TXN";
    private static final String TRANSFER_PREFIX = "TRF";

    public String generateTransactionReference() {
        return generate(TRANSACTION_PREFIX);
    }

    public String generateTransferReference() {
        return generate(TRANSFER_PREFIX);
    }

    private String generate(String prefix) {
        return prefix + "-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .toUpperCase();
    }
}
