package com.smartspend.auth.mail.impl;

import com.smartspend.auth.config.AuthProperties;
import com.smartspend.auth.mail.MailGateway;
import com.smartspend.auth.otp.model.OtpPurpose;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class SmtpMailGateway implements MailGateway {
    private final JavaMailSender mailSender;
    private final AuthProperties properties;

    public SmtpMailGateway(JavaMailSender mailSender, AuthProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    @Override
    public void sendOtp(String recipient, String otp, OtpPurpose purpose) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.mailFrom());
        message.setTo(recipient);
        message.setSubject(purpose == OtpPurpose.REGISTER
                ? "Mã xác thực đăng ký SmartSpend"
                : "Mã khôi phục mật khẩu SmartSpend");
        message.setText("Mã OTP của bạn là: " + otp + "\nMã chỉ dùng một lần và sẽ hết hạn sau 5 phút.");
        mailSender.send(message);
    }
}
