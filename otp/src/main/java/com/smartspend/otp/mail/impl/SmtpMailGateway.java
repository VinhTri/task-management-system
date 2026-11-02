package com.smartspend.otp.mail.impl;

import com.smartspend.otp.config.OtpProperties;
import com.smartspend.otp.mail.MailGateway;
import com.smartspend.otp.model.OtpPurpose;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class SmtpMailGateway implements MailGateway {
    private final JavaMailSender mailSender;
    private final OtpProperties properties;

    public SmtpMailGateway(JavaMailSender mailSender, OtpProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    @Override
    public void sendOtp(String recipient, String otp, OtpPurpose purpose) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.mailFrom());
        message.setTo(recipient);
        message.setSubject(switch (purpose) {
            case REGISTER -> "Mã xác thực đăng ký SmartSpend";
            case RESET_PASSWORD -> "Mã khôi phục mật khẩu SmartSpend";
            case RESET_PIN -> "Mã đặt lại PIN giao dịch SmartSpend";
        });
        message.setText("Mã OTP của bạn là: " + otp + "\nMã chỉ dùng một lần và sẽ hết hạn sau 5 phút.");
        mailSender.send(message);
    }
}
