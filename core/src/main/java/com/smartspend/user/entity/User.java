package com.smartspend.user.entity;

import com.smartspend.common.entity.BaseEntity;
import com.smartspend.user.enums.Role;
import com.smartspend.user.enums.UserStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "Users", indexes = @Index(name = "ux_users_email", columnList = "email", unique = true))
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 320)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserStatus status;

    protected User() {
    }

    private User(String email, String passwordHash, Role role) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = UserStatus.ACTIVE;
    }

    public static User customer(String normalizedEmail, String passwordHash) {
        return new User(normalizedEmail, passwordHash, Role.USER);
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

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public UserStatus getStatus() { return status; }
    public boolean isEnabled() { return status == UserStatus.ACTIVE; }
}

