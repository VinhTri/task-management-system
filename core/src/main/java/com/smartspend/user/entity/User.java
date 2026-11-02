package com.smartspend.user.entity;

import com.smartspend.common.entity.BaseEntity;
import com.smartspend.user.enums.Role;
import com.smartspend.user.enums.UserStatus;
import com.smartspend.user.enums.UserTheme;
import jakarta.persistence.*;

@Entity
@Table(name = "Users", indexes = @Index(name = "ux_users_email", columnList = "email", unique = true))
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 320)
    private String email;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(length = 255)
    private String avatarUrl;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UserTheme theme;

    protected User() {
    }

    private User(String email, String username, String passwordHash, Role role) {
        this.email = email;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = UserStatus.ACTIVE;
        this.theme = UserTheme.LIGHT;
    }

    public static User customer(String normalizedEmail, String passwordHash) {
        return customer(normalizedEmail, defaultUsername(normalizedEmail), passwordHash);
    }

    public static User customer(String normalizedEmail, String username, String passwordHash) {
        return new User(normalizedEmail, username, passwordHash, Role.USER);
    }

    private static String defaultUsername(String email) {
        int separator = email.indexOf('@');
        String localPart = separator > 0 ? email.substring(0, separator) : email;
        return localPart.toLowerCase().replaceAll("[^a-z0-9._-]", "_");
    }

    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
    }

    public void disable() {
        this.status = UserStatus.DISABLED;
    }

    public void enable() {
        this.status = UserStatus.ACTIVE;
    }

    public void updateUsername(String username) { this.username = username; }
    public void updateAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void updateTheme(UserTheme theme) { this.theme = theme; }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getUsername() { return username; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public UserStatus getStatus() { return status; }
    public UserTheme getTheme() { return theme; }
    public boolean isEnabled() { return status == UserStatus.ACTIVE; }
}

