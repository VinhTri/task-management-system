package com.smartspend.category.entity;

import com.smartspend.common.entity.BaseEntity;
import com.smartspend.user.entity.User;
import jakarta.persistence.*;

@Entity
@Table(name = "categories", indexes =
        @Index(name = "ix_categories_user_active_type", columnList = "user_id, active, type"))
public class Category extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(nullable = false, length = 80)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoryType type;

    @Column(nullable = false, length = 50)
    private String icon;

    @Column(nullable = false, length = 7)
    private String color;

    @Column(nullable = false)
    private boolean active;

    @Version
    @Column(nullable = false)
    private long version;

    protected Category() {}

    private Category(User user, String name, CategoryType type, String icon, String color) {
        this.user = user;
        this.name = name;
        this.type = type;
        this.icon = icon;
        this.color = color;
        this.active = true;
    }

    public static Category create(User user, String name, CategoryType type, String icon, String color) {
        return new Category(user, name, type, icon, color);
    }

    public void update(String name, CategoryType type, String icon, String color) {
        this.name = name;
        this.type = type;
        this.icon = icon;
        this.color = color;
    }

    public void deactivate() { this.active = false; }

    public Long getId() { return id; }
    public String getName() { return name; }
    public CategoryType getType() { return type; }
    public String getIcon() { return icon; }
    public String getColor() { return color; }
    public boolean isActive() { return active; }
    public long getVersion() { return version; }
}
