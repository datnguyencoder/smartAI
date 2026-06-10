package com.smartmart.repository;

import com.smartmart.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhone(String phone);

    List<Customer> findByFullNameContainingIgnoreCaseOrPhoneContaining(String fullName, String phone);

    List<Customer> findTop50ByOrderByCreatedAtDesc();
}
